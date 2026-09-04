import type { JeopardyPack } from '@workspace/game-jeopardy'

/**
 * A second infrastructure board. Goes a layer deeper than DevOps Trivia and
 * skips the categories it already covers: no IaC, pipelines or observability.
 */
export const devOpsTriviaPack2: JeopardyPack = {
  rounds: [
    {
      name: 'Jeopardy',
      values: [200, 400, 600, 800, 1000],
      categories: [
        {
          name: 'More Docker',
          clues: [
            {
              clue: 'The tool that defines a multi-container app in one YAML file.',
              answer: 'What is Docker Compose?',
              dailyDouble: false,
            },
            {
              clue: 'The public registry docker pull reads from when you name no other.',
              answer: 'What is Docker Hub?',
              dailyDouble: false,
            },
            {
              clue: 'The Dockerfile instruction for copying files in that, unlike ADD, will not unpack tarballs or fetch URLs.',
              answer: 'What is COPY?',
              dailyDouble: false,
            },
            {
              clue: 'Compiling in one stage and copying only the artifact into a slim final image is this kind of build.',
              answer: 'What is a multi-stage build?',
              dailyDouble: false,
            },
            {
              clue: "Docker's container runtime, donated to the CNCF in 2017.",
              answer: 'What is containerd?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Kubernetes Objects',
          clues: [
            {
              clue: 'The object that holds non-secret configuration as key-value pairs.',
              answer: 'What is a ConfigMap?',
              dailyDouble: false,
            },
            {
              clue: "A logical slice of a cluster; 'default' is the one you get.",
              answer: 'What is a Namespace?',
              dailyDouble: false,
            },
            {
              clue: 'The workload object that runs exactly one pod on every node.',
              answer: 'What is a DaemonSet?',
              dailyDouble: false,
            },
            {
              clue: 'The workload object for pods that need stable names and storage, like databases.',
              answer: 'What is a StatefulSet?',
              dailyDouble: true,
            },
            {
              clue: 'The status shown when a container keeps starting, dying and being restarted with a growing delay.',
              answer: 'What is CrashLoopBackOff?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Cloud Acronyms',
          clues: [
            {
              clue: 'IAM.',
              answer: 'What is identity and access management?',
              dailyDouble: false,
            },
            {
              clue: 'VPC.',
              answer: 'What is a virtual private cloud?',
              dailyDouble: false,
            },
            {
              clue: 'CDN.',
              answer: 'What is a content delivery network?',
              dailyDouble: false,
            },
            {
              clue: 'IaaS, PaaS and this one, which is what you get when you buy Salesforce.',
              answer: 'What is SaaS?',
              dailyDouble: false,
            },
            {
              clue: 'RPO, the disaster-recovery counterpart to RTO.',
              answer: 'What is recovery point objective?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Scripting',
          clues: [
            {
              clue: 'The first line of a shell script, beginning #!',
              answer: 'What is the shebang?',
              dailyDouble: false,
            },
            {
              clue: "With 'set -e', a bash script does this on the first failing command.",
              answer: 'What is exit?',
              dailyDouble: false,
            },
            {
              clue: "The command-line JSON processor whose filters look like '.items[].name'.",
              answer: 'What is jq?',
              dailyDouble: false,
            },
            {
              clue: 'The shell variable holding the exit status of the last command.',
              answer: 'What is $??',
              dailyDouble: false,
            },
            {
              clue: 'In a crontab, this many time fields precede the command.',
              answer: 'What is five?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Load Balancing',
          clues: [
            {
              clue: 'The algorithm that hands each request to the next backend in turn.',
              answer: 'What is round robin?',
              dailyDouble: false,
            },
            {
              clue: 'The web server and reverse proxy from Russia that overtook Apache.',
              answer: 'What is nginx?',
              dailyDouble: false,
            },
            {
              clue: 'Balancing at this OSI layer means reading HTTP headers; layer 4 only sees TCP.',
              answer: 'What is layer 7?',
              dailyDouble: false,
            },
            {
              clue: "AWS's layer-7 load balancer, three letters.",
              answer: 'What is the ALB?',
              dailyDouble: false,
            },
            {
              clue: 'The regular probe a balancer sends to decide whether a backend still gets traffic.',
              answer: 'What is a health check?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
    {
      name: 'Double Jeopardy',
      values: [400, 800, 1200, 1600, 2000],
      categories: [
        {
          name: 'Storage',
          clues: [
            {
              clue: 'The Kubernetes object a pod makes to ask for durable storage.',
              answer: 'What is a PersistentVolumeClaim?',
              dailyDouble: false,
            },
            {
              clue: "AWS's block storage attached to EC2 instances, three letters.",
              answer: 'What is EBS?',
              dailyDouble: false,
            },
            {
              clue: 'The RAID level that stripes across disks with no redundancy at all.',
              answer: 'What is RAID 0?',
              dailyDouble: false,
            },
            {
              clue: 'The S3 storage class for archives you can wait hours to get back.',
              answer: 'What is Glacier?',
              dailyDouble: false,
            },
            {
              clue: 'The copy-on-write filesystem from Sun that bundles volume management and checksums everything.',
              answer: 'What is ZFS?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Message Queues',
          clues: [
            {
              clue: 'The distributed log from LinkedIn whose topics are split into partitions.',
              answer: 'What is Kafka?',
              dailyDouble: false,
            },
            {
              clue: 'The broker written in Erlang that speaks AMQP.',
              answer: 'What is RabbitMQ?',
              dailyDouble: false,
            },
            {
              clue: "AWS's queue service, three letters, offered in standard and FIFO flavours.",
              answer: 'What is SQS?',
              dailyDouble: false,
            },
            {
              clue: 'Where a message goes after it has failed processing too many times.',
              answer: 'What is a dead-letter queue?',
              dailyDouble: true,
            },
            {
              clue: 'The property of a handler that makes processing the same message twice harmless.',
              answer: 'What is idempotency?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Repo Hygiene',
          clues: [
            {
              clue: 'The git command that fetches and merges in one go.',
              answer: 'What is git pull?',
              dailyDouble: false,
            },
            {
              clue: 'The GitHub setting that stops a branch being deleted or force-pushed to.',
              answer: 'What is branch protection?',
              dailyDouble: false,
            },
            {
              clue: "GitHub's bot that opens pull requests bumping outdated dependencies.",
              answer: 'What is Dependabot?',
              dailyDouble: false,
            },
            {
              clue: 'The git subcommand that binary-searches history for the commit that introduced a bug.',
              answer: 'What is bisect?',
              dailyDouble: false,
            },
            {
              clue: 'The branching model with develop, release and hotfix branches, described by Vincent Driessen in 2010.',
              answer: 'What is git-flow?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Security',
          clues: [
            {
              clue: 'An attack that floods a service with traffic from many machines at once, four letters.',
              answer: 'What is a DDoS?',
              dailyDouble: false,
            },
            {
              clue: "The public catalogue of known vulnerabilities, each with an ID like 'CVE-2021-44228'.",
              answer: 'What is CVE?',
              dailyDouble: false,
            },
            {
              clue: 'The list of every component inside a piece of software, abbreviated SBOM.',
              answer: 'What is a software bill of materials?',
              dailyDouble: false,
            },
            {
              clue: 'The open-source scanner from Aqua Security that checks container images for known vulnerabilities.',
              answer: 'What is Trivy?',
              dailyDouble: false,
            },
            {
              clue: 'The security model in which nothing inside the network is trusted by default.',
              answer: 'What is zero trust?',
              dailyDouble: false,
            },
          ],
        },
        {
          name: 'Capacity',
          clues: [
            {
              clue: 'Adding more machines is this kind of scaling; a bigger machine is vertical.',
              answer: 'What is horizontal?',
              dailyDouble: false,
            },
            {
              clue: 'The Kubernetes component that adds pods when CPU climbs, abbreviated HPA.',
              answer: 'What is the Horizontal Pod Autoscaler?',
              dailyDouble: false,
            },
            {
              clue: 'The AWS discount for committing to compute for one or three years.',
              answer: 'What are Reserved Instances, or Savings Plans?',
              dailyDouble: false,
            },
            {
              clue: "Spare AWS capacity sold at up to 90% off that can be taken back with two minutes' warning.",
              answer: 'What are Spot Instances?',
              dailyDouble: false,
            },
            {
              clue: 'The load-testing tool from Grafana Labs whose scripts are written in JavaScript.',
              answer: 'What is k6?',
              dailyDouble: false,
            },
          ],
        },
      ],
    },
  ],
  final: {
    category: 'Incident Response',
    clue: 'Alerts that fire so often nobody reads them produce this condition, in which the on-call stops responding to any of them.',
    answer: 'What is alert fatigue?',
  },
}
